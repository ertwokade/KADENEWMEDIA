"""Ortak collector arayüzü ve platformdan bağımsız veri taşıyıcıları (DTO).

Her platform collector'ı bu arayüzü uygular. Collector'lar ORM nesnesi üretmez;
saf DTO döner. DTO -> ORM kaydı `collectors/persistence.py` katmanında yapılır.
Böylece toplama mantığı, veritabanı yazımından ayrışır ve test edilebilir kalır.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from models import Account


@dataclass(slots=True)
class MetricSnapshotDTO:
    """Bir hesabın belirli andaki toplam metrikleri (metric_snapshots satırı)."""

    recorded_at: datetime
    followers: int | None = None
    total_views: int | None = None
    total_likes: int | None = None
    engagement_rate: Decimal | None = None
    extra: dict = field(default_factory=dict)


@dataclass(slots=True)
class ContentItemDTO:
    """Tekil içerik (video/post/reel/stream) performansı (content_items satırı)."""

    external_id: str
    title: str | None = None
    content_type: str | None = None
    published_at: datetime | None = None
    views: int | None = None
    likes: int | None = None
    comments: int | None = None
    shares: int | None = None
    retention_rate: Decimal | None = None


class PlatformCollector(ABC):
    """Tüm platform collector'larının ortak arayüzü.

    `session`, OAuth token yenileme gibi yan etkilerin (yenilenen token'ı DB'ye
    yazmak) yapılabilmesi için verilir.
    """

    #: Bu collector'ın hizmet ettiği platform anahtarı (platforms.key).
    platform_key: str

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    @abstractmethod
    async def fetch_account_metrics(self, account: Account) -> MetricSnapshotDTO:
        """Hesabın güncel toplam metriklerini döner."""

    @abstractmethod
    async def fetch_recent_content(self, account: Account) -> list[ContentItemDTO]:
        """Son içeriklerin performansını döner."""
