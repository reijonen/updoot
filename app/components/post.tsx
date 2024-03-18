import Stats from "./stats";
import Media from "./media";
// TODO: wat do
import type { Media as MediaT } from "./media";

export type Post = {
	media: MediaT[],
	title: string,
	link: string,
	author: string,
	timestamp: string,
	subreddit: string,
	votes: number,
	comments: number,
};

type PostProps = {
	post: Post,
};

type MetaProps = {
	author: string,
	subreddit: string,
};

const Meta = ({ author, subreddit }: MetaProps) => (
	<div className="meta">
		<div>
			<span>By </span>
			<a href={`https://old.reddit.com/u/${author}`}>
				{author}
			</a>
		</div>
		<span> </span>
		<div>
			<span>in </span>
			<a href={`https://old.reddit.com/u/${subreddit}`}>
				{subreddit}
			</a>
		</div>
	</div>
);

const Post = ({ post }: PostProps) => {
	return (
		<div className="post">
			<a href={post.link}>
				<h3 className="title">{post.title}</h3>
			</a>
			{post.media && <Media media={post.media} />}
			<div className="footer">
				<Meta author={post.author} subreddit={post.subreddit} />
				<Stats
					votes={post.votes}
					comments={post.comments}
					timestamp={post.timestamp}
				/>
			</div>
		</div>
	);
};

export default Post;