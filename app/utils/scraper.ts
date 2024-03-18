import Xray from "x-ray";
import cheerio from "cheerio";
import fetch from 'node-fetch';

import getBrowser from "./getBrowser";
import { MediaType } from "../components/media";

type ScrapedPost = {
	mediaUri: string,
	title: string,
	link: string,
	author: string,
	timestamp: string,
	subreddit: string,
	votes: string,
	comments: string,
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
	const browser = await getBrowser();
	const page = await browser.newPage();
	await page.goto(uri);
	await new Promise((resolve) => setTimeout(resolve, 3000));
	const htmlContent = await page.content();
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

const parseToNumber = (input: string): number | null => {
	const numericString = input.replace(/[^\d.k]/g, '');
	if (numericString === '')
		return null;

	if (numericString.endsWith('k')) {
		const num = parseFloat(numericString);
		return isNaN(num) ? null : num * 1000;
	}

	const parsed = parseFloat(numericString);
	return isNaN(parsed) ? null : parsed;
};

const getFrontpage = async (geoFilter = "GLOBAL") => {
	// TODO: geofilters
	const res = await x(`https://old.reddit.com/r/popular/?geo_filter=${geoFilter}`, ".thing", [
		{
			mediaUri: ".thumbnail@href",
			title: ".top-matter a.title",
			link: ".bylink.comments@href",
			author: ".tagline .author",
			timestamp: ".tagline .live-timestamp",
			subreddit: ".tagline .subreddit",
			votes: ".score.unvoted",
			comments: ".bylink.comments",
		}
	]);

	return await Promise.all(res.map(async (post: ScrapedPost) => ({
		media: await scrapeMedia(post.mediaUri, post.link),
		title: post.title,
		link: post.link,
		author: post.author,
		timestamp: post.timestamp,
		subreddit: post.subreddit.substring(2),
		votes: parseToNumber(post.votes),
		comments: parseToNumber(post.comments)
	})));
};

export default {
	getFrontpage
};