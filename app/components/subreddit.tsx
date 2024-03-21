import InfiniteScroll from 'react-infinite-scroll-component';
import { useState } from "react";

import Post from "./post";
// TODO: wat do
import type { Post as PostT } from "./post";

type SubredditProps = {
	posts: PostT[],
	showAuthor: boolean,
	showSubreddit: boolean,
};


const Subreddit = ({ posts, showAuthor, showSubreddit }: SubredditProps) => {
	// TODO: is ssr still possible?
	const [_posts, usePosts] = useState(posts);
	const [hasMore, setHasMore] = useState(true);

	const loadNext = async () => {
		// todo: hacky or not?
		const subreddit = _posts[_posts.length - 1].subreddit;
		const lastPostId = _posts[_posts.length - 1].id;
		const res = await fetch(`/api/next-posts?subreddit=${subreddit}&after=${lastPostId}`);
		const nextPosts = await res.json();

		if (nextPosts.length < 1) {
			setHasMore(false);
		}

		// TODO: checkkaa if status isnt 200
		console.log("status", res.status);

		usePosts([..._posts, ...nextPosts]);
	};

	return (
		<div className="posts">
			<InfiniteScroll
				dataLength={_posts.length}
				next={loadNext}
				hasMore={hasMore}
				loader={<h4>Loading...</h4>}
				endMessage={
					<p style={{ textAlign: 'center' }}>
						<b>Yay! You have seen it all</b>
					</p>
				}
			>
				{_posts.map((post, idx) => (
					<Post
						key={idx}
						post={post}
						showAuthor={showAuthor}
						showSubreddit={showSubreddit}
					/>
				))}
			</InfiniteScroll>
		</div>
	);
};

export default Subreddit;