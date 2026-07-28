// Hakkımızda ve Ekip sayfalarının doğrulanmış statik tabanı.
// Admin içeriği erişilemezse veya boş bırakılırsa bu kayıtlar görünür.
export const VERIFIED_TEAM = [
  {
    name: 'Kadir Demir',
    roleTr: 'Kurucu & CEO',
    roleEn: 'Founder & CEO',
    bioTr: 'Dijital pazarlama ve sosyal medya stratejisi üzerine çalışıyor; müşteri ilişkileri ve ajansın genel gidişatı da onun sorumluluğunda.',
    bioEn: 'Focused on digital marketing and social media strategy. Drives client growth and agency vision.',
    avatar: '/kadir.jpg',
    image: '/kadir.jpg',
    social: {},
    color: '#eac321',
  },
]

export const ABOUT_CONTENT_FALLBACK = {
  storyTr: '',
  storyEn: '',
  missionTr: '',
  missionEn: '',
  experience: '—',
  teamSize: '—',
  clients: '—',
  team: VERIFIED_TEAM,
}
