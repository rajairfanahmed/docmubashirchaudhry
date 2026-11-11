import { permanentRedirect } from 'next/navigation';
import { getContentRepository } from '@/lib/data';

export async function generateStaticParams() {
  const repo = getContentRepository();
  const posts = await repo.getRecruitmentPosts('ppsc');
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function DeprecatedBlueprintRedirectPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  permanentRedirect(`/ppsc/${slug}`);
}
