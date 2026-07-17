"""YouTube collector + OAuth2 yardımcıları (Faz 1).

- OAuth2: kendi kanalına bağlan, refresh token'ı Fernet ile şifreli sakla.
- Data API v3 (`channels.list`, `playlistItems.list`, `videos.list`) ile abone
  sayısı, toplam izlenme ve son N videonun performansı.

Bağımlılık olarak yalnızca httpx kullanılır (google-api-python-client'a gerek yok).
"""

from datetime import UTC, datetime, timedelta

import httpx

from collectors.base import ContentItemDTO, MetricSnapshotDTO, PlatformCollector
from core.config import settings
from core.security import decrypt_token, encrypt_token
from models import Account

# --- OAuth2 sabitleri ---
AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URL = "https://oauth2.googleapis.com/token"
SCOPES = [
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/yt-analytics.readonly",
]

# --- API uçları ---
DATA_API = "https://www.googleapis.com/youtube/v3"

#: Her toplamada çekilecek son video sayısı (scaffold: son 10 video).
RECENT_VIDEO_COUNT = 10
#: Access token süresi dolmaya bu kadar kala yenile.
TOKEN_REFRESH_SKEW = timedelta(minutes=5)


# --------------------------------------------------------------------------- #
# OAuth2 akışı
# --------------------------------------------------------------------------- #
def build_authorization_url(redirect_uri: str, state: str) -> str:
    """Kullanıcının yönlendirileceği Google izin ekranı URL'i.

    `access_type=offline` + `prompt=consent` ile refresh token garanti edilir.
    """
    from urllib.parse import urlencode

    params = {
        "client_id": settings.youtube_client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }
    return f"{AUTH_URL}?{urlencode(params)}"


async def exchange_code_for_tokens(code: str, redirect_uri: str) -> dict:
    """Authorization code -> access/refresh token."""
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.youtube_client_id,
                "client_secret": settings.youtube_client_secret,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
        )
        resp.raise_for_status()
        return resp.json()


async def refresh_access_token(refresh_token: str) -> dict:
    """Refresh token ile yeni access token al."""
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            TOKEN_URL,
            data={
                "refresh_token": refresh_token,
                "client_id": settings.youtube_client_id,
                "client_secret": settings.youtube_client_secret,
                "grant_type": "refresh_token",
            },
        )
        resp.raise_for_status()
        return resp.json()


async def fetch_channel_identity(access_token: str) -> dict:
    """OAuth sonrası, hesabı kaydetmek için kanal id + handle döner."""
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            f"{DATA_API}/channels",
            params={"part": "snippet", "mine": "true"},
            headers={"Authorization": f"Bearer {access_token}"},
        )
        resp.raise_for_status()
        items = resp.json().get("items", [])
        if not items:
            raise RuntimeError("Bu hesaba bağlı bir YouTube kanalı bulunamadı.")
        ch = items[0]
        snippet = ch.get("snippet", {})
        handle = snippet.get("customUrl") or snippet.get("title") or ch["id"]
        return {"external_id": ch["id"], "handle": handle}


# --------------------------------------------------------------------------- #
# Collector
# --------------------------------------------------------------------------- #
class YouTubeCollector(PlatformCollector):
    platform_key = "youtube"

    async def _access_token(self, account: Account) -> str:
        """Geçerli bir access token döner; süresi dolmuşsa yeniler ve DB'ye yazar."""
        now = datetime.now(UTC)
        expires = account.token_expires_at
        if account.access_token and expires and expires - TOKEN_REFRESH_SKEW > now:
            return decrypt_token(account.access_token)

        if not account.refresh_token:
            raise RuntimeError(
                f"Hesap {account.id} için refresh_token yok; yeniden OAuth gerekli."
            )

        data = await refresh_access_token(decrypt_token(account.refresh_token))
        new_access = data["access_token"]
        account.access_token = encrypt_token(new_access)
        account.token_expires_at = now + timedelta(seconds=data.get("expires_in", 3600))
        # refresh_token genelde yeniden gelmez; geldiyse güncelle.
        if data.get("refresh_token"):
            account.refresh_token = encrypt_token(data["refresh_token"])
        await self.session.commit()
        return new_access

    async def fetch_account_metrics(self, account: Account) -> MetricSnapshotDTO:
        token = await self._access_token(account)
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(
                f"{DATA_API}/channels",
                params={"part": "statistics", "id": account.external_id},
                headers={"Authorization": f"Bearer {token}"},
            )
            resp.raise_for_status()
            items = resp.json().get("items", [])
        if not items:
            raise RuntimeError(f"Kanal istatistiği alınamadı: {account.external_id}")
        stats = items[0]["statistics"]
        followers = int(stats.get("subscriberCount", 0))
        total_views = int(stats.get("viewCount", 0))
        return MetricSnapshotDTO(
            recorded_at=datetime.now(UTC),
            followers=followers,
            total_views=total_views,
            extra={"video_count": int(stats.get("videoCount", 0))},
        )

    async def fetch_recent_content(self, account: Account) -> list[ContentItemDTO]:
        token = await self._access_token(account)
        headers = {"Authorization": f"Bearer {token}"}
        async with httpx.AsyncClient(timeout=30) as client:
            # 1) Kanalın "uploads" oynatma listesini bul.
            ch = await client.get(
                f"{DATA_API}/channels",
                params={"part": "contentDetails", "id": account.external_id},
                headers=headers,
            )
            ch.raise_for_status()
            ch_items = ch.json().get("items", [])
            if not ch_items:
                return []
            uploads = ch_items[0]["contentDetails"]["relatedPlaylists"]["uploads"]

            # 2) Son videoların id'lerini al.
            pl = await client.get(
                f"{DATA_API}/playlistItems",
                params={
                    "part": "contentDetails",
                    "playlistId": uploads,
                    "maxResults": RECENT_VIDEO_COUNT,
                },
                headers=headers,
            )
            pl.raise_for_status()
            video_ids = [
                it["contentDetails"]["videoId"] for it in pl.json().get("items", [])
            ]
            if not video_ids:
                return []

            # 3) Videoların istatistik + başlığını çek.
            vids = await client.get(
                f"{DATA_API}/videos",
                params={"part": "snippet,statistics", "id": ",".join(video_ids)},
                headers=headers,
            )
            vids.raise_for_status()
            video_items = vids.json().get("items", [])

        result: list[ContentItemDTO] = []
        for v in video_items:
            snippet = v.get("snippet", {})
            stats = v.get("statistics", {})
            published = snippet.get("publishedAt")
            result.append(
                ContentItemDTO(
                    external_id=v["id"],
                    title=snippet.get("title"),
                    content_type="video",
                    published_at=(
                        datetime.fromisoformat(published.replace("Z", "+00:00"))
                        if published
                        else None
                    ),
                    views=int(stats["viewCount"]) if "viewCount" in stats else None,
                    likes=int(stats["likeCount"]) if "likeCount" in stats else None,
                    comments=(
                        int(stats["commentCount"]) if "commentCount" in stats else None
                    ),
                )
            )
        return result
