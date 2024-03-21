import Subreddit from "../components/subreddit";
import Scraper from "../utils/scraper";

import type { Post } from "../components/post";

export default ({ posts }: { posts: Post[]; }) =>
	<Subreddit
		posts={posts}
		showAuthor={false}
		showSubreddit={true}
	/>;

export async function getServerSideProps() {
	const posts = await Scraper.getSubreddit("popular");

	return {
		props: { posts }
	};
}