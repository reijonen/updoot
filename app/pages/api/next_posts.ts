import type { NextApiRequest, NextApiResponse } from "next";
import type { Post } from "../../components/post";

import scraper from "../../utils/scraper";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<Post[]>,
) {
	const { subreddit, after } = req.query;

	// TODO: validate data at router level
	// TODO: reddit post id format validation
	const posts = await scraper.getSubreddit(subreddit as string, after as string);

	res.status(200).json(posts);
}
