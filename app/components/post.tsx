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
	commentCount: number,
	comments: string;
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
			<div className="title">
				<a href={post.link}>{post.title}</a>
				{post.link !== post.comments && <span>({new URL(post.link).hostname})</span>}
			</div>
			{post.media && <Media media={post.media} />}
			<div className="footer">
				<div>
					<Stats
						votes={post.votes}
						comments={post.commentCount}
						timestamp={post.timestamp}
					/>
					<Meta author={post.author} subreddit={post.subreddit} />
				</div>
				<a href={post.comments}>Comments</a>
			</div>
		</div>
	);
};

export default Post;