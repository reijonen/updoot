import Xray from "x-ray"
import puppeteer from "puppeteer";
import cheerio from "cheerio"
import Slider from "react-slick";
import fetch from 'node-fetch';

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

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

enum ScrapeMediaType {
	Image,
	Video,
	Gallery
}

enum MediaType {
	Image,
	Video,
}

type Media = {
	type: MediaType,
	uri: string
}

type Post = {
	media: Media[],
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

const InnerMedia = ({ media }: { media: Media }) => (
	<div className="container">
		{media.type === MediaType.Image
			? <img src={media.uri} />
			: <video src={media.uri} controls={true} playsInline={true} />}
	</div>
)

const Media = ({ media }: { media: Media[] }) => (
	<div className="media">
		{media.length > 1
			? <Slider
				speed={300}
				accessibility={false}
				arrows={false}
				infinite={false}
				dots={true}
			>
				{media.map((media) =>
					<InnerMedia media={media} />
				)}
			</Slider>
			: <InnerMedia media={media[0]} />}
	</div>
)

export default ({ posts }: { posts: Post[] }) => (
	<div className="posts">
		{posts.map((post, idx) => (
			<div className="post" key={idx}>
				<a href={post.link}>
					<h3 className="title">{post.title}</h3>
				</a>
				{post.media.length > 0 &&
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

function getMediaType(url: string): ScrapeMediaType | null {
	if (url.startsWith("https://i.redd.it/")) {
		return ScrapeMediaType.Image
	} else if (url.startsWith("https://v.redd.it/")) {
		return ScrapeMediaType.Video
	} else if (url.startsWith("https://www.reddit.com/gallery/")) {
		return ScrapeMediaType.Gallery
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
			posts: await Promise.all(res.map(async (post: ScrapedPost) => {
				const mediaType = getMediaType(post.mediaUri)

				let media = []

				switch (mediaType) {
					case ScrapeMediaType.Image:
						media.push({
							type: MediaType.Image,
							uri: post.mediaUri
						})
						break;
					case ScrapeMediaType.Video:
						const res = await fetch(`${post.link}/.json`)
						const data = await res.json();
						console.log("data", data[0].data.children[0].data.media);

						media.push({
							type: MediaType.Video,
							uri: data[0].data.children[0].data.media.reddit_video.fallback_url
						})
						break;

					case ScrapeMediaType.Gallery:
						const browser = await puppeteer.launch({
							args: [
								'--no-sandbox',
								'--disable-setuid-sandbox',
								'--disable-infobars',
								'--window-position=0,0',
								'--ignore-certifcate-errors',
								'--ignore-certifcate-errors-spki-list',
								'--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36"'
							]
						});
						const page = await browser.newPage();
						await page.goto(post.mediaUri);
						await new Promise((resolve) => setTimeout(resolve, 3000))
						const htmlContent = await page.content();
						await browser.close();
						const $ = cheerio.load(htmlContent);

						const images = $("img")
							.map((_, e) => $(e).attr("src"))
							.get()
							.filter((uri) => uri.includes("preview.redd.it"));

						console.log("images", images)

						// TODO: gallery videos
						media = images.map((uri) => ({
							type: MediaType.Image,
							uri
						}))
						console.log("media:", media)
						break;

					default: break;
				}

				const subreddit = post.subreddit.substring(2);
				const postVotes = parseInt(post.votes);
				const votes = !Number.isNaN(postVotes) ? postVotes : null;
				const comments = parseInt(post.comments);

				return {
					media,
					title: post.title,
					link: post.link,
					author: post.author,
					timestamp: post.timestamp,
					subreddit,
					votes,
					comments
				}
			}))
		}
	}
}