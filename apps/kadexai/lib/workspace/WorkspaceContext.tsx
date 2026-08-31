'use client'

import { createContext, useContext, useMemo } from 'react'
import { workspaceHref } from '@/lib/workspace/slug'

/**
 * Panelin içindeki bağlantılar kullanıcının kendi adresini taşır:
 * /kadexai/<slug>/dashboard/...
 *
 * Adres olmadan yazılan bağlantı da çalışır (proxy kullanıcıyı kendi adresine
 * yönlendirir) ama her tıklamada fazladan bir gidiş-dönüş olur. Bu bağlam,
 * bağlantıları en baştan doğru adresle üretmek için var.
 *
 * Slug bir yetki değil, yalnızca adrestir; erişim sunucuda oturumdan
 * doğrulanır.
 */
const WorkspaceSlugContext = createContext<string | null>(null)

export function WorkspaceProvider({
  slug,
  children,
}: {
  slug: string | null
  children: React.ReactNode
}) {
  return <WorkspaceSlugContext.Provider value={slug}>{children}</WorkspaceSlugContext.Provider>
}

export function useWorkspaceSlug(): string | null {
  return useContext(WorkspaceSlugContext)
}

/**
 * Panel içi bağlantı üretir. Bağlam yoksa (ör. bağımsız render) adresteki
 * slug'a bakar, o da yoksa eski davranışa döner.
 */
export function useWorkspaceHref(): (path: string) => string {
  const slug = useContext(WorkspaceSlugContext)
  return useMemo(() => {
    return (path: string) => workspaceHref(path, slug)
  }, [slug])
}
