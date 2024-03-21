import Xray from "x-ray";
import makeDriver from "request-x-ray";
import fetch from 'node-fetch';
import Request from "request";

import { MediaType } from "../components/media";
import type { Post } from "../components/post";
import type { Media } from "../components/media";

type ScrapedPost = {
	id: string;
	mediaUri: string,
	title: string,
	link: string,
	author: string,
	timestamp: string,
	subreddit: string,
	votes: string,
	commentCount: string,
	comments: string;
};


const x = Xray();
x.driver(makeDriver({
	headers: {
		"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36",
		"Cookie": "session_tracker='mlnnrfdrrabdojgbgr.0.1711033859415.Z0FBQUFBQmxfRTREeUNzT1M0YThRZzExbklZMWM5ZHMwMm5pUGRxZGpkZmZjZFI1MHloT0RvYWNvbmd0dkVOWVNrMW9HOHlZYl9ncDFMZkttZ1ZURXpTaHg2SnlMdUZRdE1HbTVtejgxb0QxVWVRNTNVTktWVFJyWXAzd29VX0diaTJxVTMwRWNQRlA';over18=1;"
	}
}));

const scrapeVideo = async (postLink: string) => {
	const res = await fetch(`${postLink}/.json`);
	const data = await res.json();
	// console.log("p", data[0].data.children[0].data);
	// console.log("data", data[0].data.children[0].data.media);

	return data[0].data.children[0].data.media.reddit_video.fallback_url;
};

// TODO: gallery videos
const scrapeGallery = async (uri: string): Promise<Media[]> => {
	const res = await fetch(`${uri}.json`);
	const json = await res.json();

	const metadata = json[0].data.children[0].data.media_metadata;
	const ids = json[0].data.children[0].data.gallery_data.items.map(({ media_id }) => media_id);

	return ids.map((id: string) => {
		let mediaType = null;
		switch (metadata[id].e) {
			case "Image":
				mediaType = MediaType.Image;
				break;
			case "Video":
				mediaType = MediaType.Video;
				break;
			default: console.log("Unrecognized media type:", metadata[id].e);
		}

		// smaller preview sizes metadata[id].p - optimizations?
		return {
			type: mediaType,
			uri: `/api/reddit-proxy?uri=${encodeURIComponent(metadata[id].s.u.replace(/&amp;/g, '&'))}`
		};
	});

};

const scrapeMedia = async (uri: string, link: string) => {
	if (uri.startsWith("https://i.redd.it/")) {
		return [{
			type: MediaType.Image,
			uri
		}];
	} else if (uri.startsWith("https://v.redd.it/")) {
		return [{
			type: MediaType.Video,
			uri: await scrapeVideo(link)
		}];
	} else if (uri.startsWith("https://www.reddit.com/gallery/")) {
		return await scrapeGallery(link);
	} else {
		// TODO: error
		return null;
	}
};

const parseToNumber = (input: string): number => {
	const numericString = input.replace(/[^\d.k]/g, '');
	if (numericString === '')
		return 0;

	if (numericString.endsWith('k')) {
		const num = parseFloat(numericString);
		return isNaN(num) ? 0 : num * 1000;
	}

	const parsed = parseFloat(numericString);
	return isNaN(parsed) ? 0 : parsed;
};

const toPost = async (post: ScrapedPost, subreddit?: string): Promise<Post> => ({
	id: post.id.substring(9),
		media: await scrapeMedia(post.mediaUri, post.comments),
		title: post.title,
	link: post.link.startsWith("https://i.redd.it/") || post.link.startsWith("https://v.redd.it/") || post.link.startsWith("https://www.reddit.com/gallery") ? post.comments : post.link,
		author: post.author || null,
		timestamp: post.timestamp,
		subreddit: subreddit || post.subreddit.substring(2),
		votes: parseToNumber(post.votes),
		commentCount: parseToNumber(post.commentCount),
		comments: post.comments,
	})));
};

const getFrontpage = async (geoFilter = "GLOBAL") => {
	// TODO: geofilters
	const res = await x(`https://old.reddit.com/r/popular/?geo_filter=${geoFilter}`, ".thing", [
		{
			id: "@id",
			mediaUri: ".thumbnail@href",
			title: ".top-matter a.title",
			link: ".top-matter a.title@href",
			author: ".tagline .author",
			timestamp: ".tagline .live-timestamp",
			subreddit: ".tagline .subreddit",
			votes: ".score.unvoted",
			commentCount: ".bylink.comments",
			comments: ".bylink.comments@href",
		}
	]);

	return parseIntoPost(res);
};


// TODO: geofilters?
const getSubreddit = async (subreddit: string, postId?: string) => {
	const next = postId ? `?count=25&after=t3_${postId}` : "";

	const res = await x(`https://old.reddit.com/r/${subreddit}${next}`, ".thing", [
		{
			isSponsored: ".promoted-tag",
			id: "@id",
			mediaUri: ".thumbnail@href",
			title: ".top-matter a.title",
			link: ".top-matter a.title@href",
			author: ".tagline .author",
			timestamp: ".tagline .live-timestamp",
			votes: ".score.unvoted",
			commentCount: ".bylink.comments",
			comments: ".bylink.comments@href",
		}
	]);

	return await Promise.all(res
		.filter(({ isSponsored }) => !!!isSponsored)
		.map(async (post) => await toPost(post, subreddit)));
};

const recmap = (comments) => {
	return comments.map(({ data }) => {
		const { created, author, body, ups, replies } = data;
		return {
			created: created || null,
			author: author || null,
			body: body || null,
			votes: ups || null,
			replies: replies ? replies.data ? recmap(replies.data.children) : null : null
		};
	});
};

type Reply = {
	created: number,
	author: string,
	body: string,
	ups: number,
	replies: Reply[] | null;
};

type PostComments = Post & {
	comments: Reply[] | null;
};

const getComments = async (subreddit: string, postId: string, removeRemoved: boolean = true): Promise<PostComments> => {
	const url = `https://old.reddit.com/r/${subreddit}/comments/${postId}`;

	const res = await x(url, `#thing_t3_${postId}`, [
		{
			mediaUri: ".thumbnail@href",
			title: ".top-matter a.title",
			author: ".tagline .author",
			// TODO: time@datetime?
			timestamp: ".tagline>time",
			votes: ".score.unvoted",
			commentCount: ".bylink.comments",
		}
	]);

	const scrapedPost = res.pop();
	scrapedPost.id = `thing_t3_${postId}`;
	scrapedPost.subreddit = subreddit;
	scrapedPost.link = url;
	scrapedPost.comments = url;

	const post = await toPost(scrapedPost, subreddit) as PostComments;
	// TODO: fix
	post.link = null;

	const c = await fetch(`${url}.json`);
	const json = await c.json();
	const comments = json[1].data.children;
	post.comments = recmap(comments);

	return post;
};

export default {
	getFrontpage,
	getComments
};