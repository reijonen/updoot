import fetch from "node-fetch";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	const uri = req.query.uri as string;

	console.log("proxy:", uri);
	const redditRes = await fetch(uri, {
		headers: {
			"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0 Safari/537.36",
		}
	});

	res.setHeader("Content-Type", redditRes.headers.get("Content-Type"));
	redditRes.body.pipe(res);
}
