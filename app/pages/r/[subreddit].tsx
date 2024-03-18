import Subreddit from "../../components/subreddit";
import Scraper from "../../utils/scraper";

import type { Post } from "../../components/post";

export default ({ posts }: { posts: Post[]; }) => <Subreddit posts={posts} />;

export async function getServerSideProps(context) {
	const posts = await Scraper.getSubreddit(context.query.subreddit);

	return {
		props: { posts }
	};
}