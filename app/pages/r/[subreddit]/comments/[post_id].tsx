import Media from "../../../../components/media";
import scraper from "../../../../utils/scraper";

export default ({ postWithComments }) => {
	const { comments, ...post } = postWithComments;

	const recursiveComments = (comments) => {
		if (!comments) return;
		return comments.map(({ created, author, body, votes, replies }) => (
			<div>
				<p>{created}</p>
				<p>{author}</p>
				<p>{body}</p>
				<p>{votes}</p>
				<div className="replies">
					{recursiveComments(replies)}
				</div>
			</div>
		));
	};

	return (
		<div>
			<div id={post.id}>
				<Media media={post.media} />
				<p>{post.title}</p>
				<p>{post.author}</p>
				<p>{post.timestamp}</p>
				<p>{post.subreddit}</p>
				<p>{post.votes}</p>
				<p>{post.commentCount}</p>
			</div>
			<div className="comments">
				{recursiveComments(comments)}
			</div>
		</div>
	);
};

export async function getServerSideProps(context) {
	const { subreddit, post_id } = context.query;

	const postWithComments = await scraper.getComments(subreddit, post_id);

	return { props: { postWithComments } };
}
