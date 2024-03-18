import Post from "./post";
// TODO: wat do
import type { Post as PostT } from "./post";

const Subreddit = ({ posts }: { posts: PostT[]; }) => (
	<div className="posts">
		{posts.map((post, idx) => (
			<Post key={idx} post={post} />
		))}
	</div>
);

export default Subreddit;