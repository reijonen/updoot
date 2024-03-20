import Stats from "./stats";
import Media from "./media";
// TODO: wat do
import type { Media as MediaT } from "./media";

export type Post = {
	id: string,
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
	showAuthor: boolean,
	showSubreddit: boolean,
};

type MetaProps = {
	author: string,
	subreddit: string,
	showAuthor: boolean,
	showSubreddit: boolean,
};

const Meta = ({ author, subreddit, showAuthor, showSubreddit }: MetaProps) => (
	<div className="meta">
		{showAuthor && (
			<div>
				<span>by </span>
				<a href={author ? `https://old.reddit.com/u/${author}` : ""}>
					{author || "[deleted]"}
				</a>
			</div>
		)}
		<span> </span>
		{showSubreddit && (
			<div>
				<span>in </span>
				<a href={`https://old.reddit.com/u/${subreddit}`}>
					{subreddit}
				</a>
			</div>
		)}
	</div>
);

const Post = ({ post, showAuthor, showSubreddit }: PostProps) => (
	<div id={post.id} className="post">
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
				<Meta
					author={post.author}
					subreddit={post.subreddit}
					showAuthor={showAuthor}
					showSubreddit={showSubreddit}
				/>
			</div>
			<a href={post.comments}>Comments</a>
		</div>
	</div>
);

export default Post;