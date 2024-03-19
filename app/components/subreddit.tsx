import Post from "./post";
// TODO: wat do
import type { Post as PostT } from "./post";

type SubredditProps = {
	posts: PostT[],
	showAuthor: boolean,
	showSubreddit: boolean,
};

const Subreddit = ({ posts, showAuthor, showSubreddit }: SubredditProps) => (
	<div className="posts">
		{posts.map((post, idx) => (
			<Post
				key={idx}
				post={post}
				showAuthor={showAuthor}
				showSubreddit={showSubreddit}
			/>
		))}
	</div>
);

export default Subreddit;