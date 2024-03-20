import Xray from "x-ray";
import cheerio from "cheerio";
import fetch from 'node-fetch';

import { getPage } from "./browser";
import { MediaType } from "../components/media";

type ScrapedPost = {
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

const scrapeVideo = async (postLink: string) => {
	const res = await fetch(`${postLink}/.json`);
	const data = await res.json();
	// console.log("p", data[0].data.children[0].data);
	// console.log("data", data[0].data.children[0].data.media);

	return data[0].data.children[0].data.media.reddit_video.fallback_url;
};

// TODO: gallery videos
const scrapeGallery = async (uri: string) => {
	const page = await getPage();
	await page.goto(uri);
	await new Promise((resolve) => setTimeout(resolve, 3000));
	const htmlContent = await page.content();
	await page.close();
	const $ = cheerio.load(htmlContent);

	return $("img")
		.map((_, e) => $(e).attr("src"))
		.get()
		.filter((uri) => uri.includes("preview.redd.it"))
		.map((uri) => ({
			type: MediaType.Image,
			uri
		}));
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
		return await scrapeGallery(uri);
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

const parseIntoPost = async (res: ScrapedPost[], subreddit?: string) => {
	return await Promise.all(res.map(async (post: ScrapedPost) => ({
		media: await scrapeMedia(post.mediaUri, post.comments),
		title: post.title,
		link: post.link.startsWith("https://i.redd.it/") || post.link.startsWith("https://v.redd.it/") ? post.comments : post.link,
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

const getSubreddit = async (subreddit: string) => {
	const res = await x(`https://old.reddit.com/r/${subreddit}`, ".thing", [
		{
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

	return await parseIntoPost(res, subreddit);
};

export default {
	getFrontpage,
	getSubreddit
};