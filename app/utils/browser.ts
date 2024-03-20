import puppeteer from "puppeteer";

let browser = null;
export const getPage = async () => {
	if (!browser) {
		console.log("browser not initialized");
		browser = await puppeteer.connect({
			browserURL: "http://127.0.0.1:9222"
		});
		console.log("browser connected");
	}

	return await browser.newPage();
};