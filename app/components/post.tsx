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
	post: Post;
};

const Post = ({ post }: PostProps) => {
	return (
		<div className="post">
			<a href={post.link}>
				<h3 className="title">{post.title}</h3>
			</a>
			{post.media &&
				// <a href={post.link}>
				<Media media={post.media} />
				// </a>
			}
			<div className="footer">
				<div className="meta">
					<div>
						<span>By </span>
						<a href={`https://old.reddit.com/u/${post.author}`}>
							{post.author}
						</a>
					</div>
					<span> </span>
					<div>
						<span>in </span>
						<a href={`https://old.reddit.com/u/${post.subreddit}`}>
							{post.subreddit}
						</a>
					</div>
				</div>
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