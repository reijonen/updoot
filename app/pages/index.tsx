import Subreddit from "../components/subreddit";
import Scraper from "../utils/scraper";

import type { Post } from "../components/post";

export default ({ posts }: { posts: Post[]; }) => <Subreddit posts={posts} />;

export async function getServerSideProps() {
	const posts = await Scraper.getFrontpage();

	return {
		props: { posts }
	};
}