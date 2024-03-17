import Xray from "x-ray"
const x = Xray()

type ScrapedPost = {
	mediaUri: string,
	title: string,
	link: string,
	author: string,
	timestamp: string,
	subreddit: string,
	votes: string,
	comments: string,
}

enum MediaType {
	Image,
	Video
}

type Post = {
	mediaUri: string | null,
	mediaType: MediaType | null,
	title: string,
	link: string,
	author: string,
	timestamp: string,
	subreddit: string,
	votes: number,
	comments: number,
}

function roundToNearestThousand(num: number): string {
	if (num < 100) {
		return num.toString()
	} else {
		const roundedNum = Math.round(num / 100) / 10; // Round to nearest tenth
		return `${roundedNum.toFixed(1)}k`;
	}
}

const Comment = ({ commentCount }: { commentCount: number }) => (
	<div className="bwt">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="1.5"
			stroke="currentColor"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z"
			/>
		</svg>
		<span>{roundToNearestThousand(commentCount)}</span>
	</div>
)

const Votes = ({ votes }: { votes: number }) => (
	<div className="bwt">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="1.5"
			stroke="currentColor"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
			/>
		</svg>
		<span>{roundToNearestThousand(votes)}</span>
	</div>
)

function formatRelativeTime(timestamp: string): string {
	const regex = /(\d+)\s+(\w+)\s+ago/i;
	const match = timestamp.match(regex);

	if (!match) {
		return 'Invalid timestamp';
	}

	const amount = parseInt(match[1]);
	const unit = match[2].toLowerCase();

	switch (unit) {
		case 'second':
		case 'seconds':
			return `${amount}s`;
		case 'minute':
		case 'minutes':
			return `${amount}min`;
		case 'hour':
		case 'hours':
			return `${amount}h`;
		case 'day':
		case 'days':
			return `${amount}d`;
		case 'week':
		case 'weeks':
			return `${amount}w`;
		case 'month':
		case 'months':
			return `${amount}mo`;
		case 'year':
		case 'years':
			return `${amount}y`;
		default:
			return 'Invalid timestamp';
	}
}

const Timestamp = ({ timestamp }: { timestamp: string }) => (
	<div className="bwt">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="1.5"
			stroke="currentColor"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
			/>
		</svg>
		<span>{formatRelativeTime(timestamp)}</span>
	</div>
)

export default ({ posts }: { posts: Post[] }) => (
	<div className="posts">
		{posts.map((post, idx) => (
			<div className="post" key={idx}>
				<a href={post.link}>
					<h3 className="title">{post.title}</h3>
					{post.mediaType !== null && (
						post.mediaType === MediaType.Image ? (
							<img src={post.mediaUri} />
						) : (
							<video src={post.mediaUri} />
						)
					)}
				</a>
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
					<div className="stats">
						{post.votes && <Votes votes={post.votes} />}
						<Comment commentCount={post.comments} />
						<Timestamp timestamp={post.timestamp} />
					</div>
				</div>
			</div>
		))}
	</div>
)

function getMediaType(url: string): MediaType | null {
	if (url.startsWith("https://i.redd.it/")) {
		return MediaType.Image
	} else if (url.startsWith("https://v.redd.it/")) {
		return MediaType.Video
	} else {
		return null
	}
}

export async function getServerSideProps() {
	// TODO: geofilters
	const res = await x("https://old.reddit.com", ".thing", [
		{
			mediaUri: ".thing .thumbnail@href",
			title: ".top-matter a.title",
			link: ".bylink.comments@href",
			author: ".tagline .author",
			timestamp: ".tagline .live-timestamp",
			subreddit: ".tagline .subreddit",
			votes: ".score.unvoted",
			comments: ".bylink.comments",
		}
	]);

	return {
		props: {
			posts: res.map((post: ScrapedPost) => {
				const mediaType = getMediaType(post.mediaUri)
				const mediaUri = mediaType !== null ? post.mediaUri : null;
				const subreddit = post.subreddit.substring(2);
				const postVotes = parseInt(post.votes);
				const votes = !Number.isNaN(postVotes) ? postVotes : null;
				const comments = parseInt(post.comments);

				return {
					mediaUri,
					mediaType,
					title: post.title,
					link: post.link,
					author: post.author,
					timestamp: post.timestamp,
					subreddit,
					votes,
					comments
				}
			})
		}
	}
}