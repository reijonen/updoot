import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export enum MediaType {
	Image,
	Video,
}

export type Media = {
	type: MediaType,
	uri: string,
};

const InnerMedia = ({ media }: { media: Media; }) => (
	<div className="container">
		{media.type === MediaType.Image
			? <img src={media.uri} />
			: <video src={media.uri} controls={true} playsInline={true} />}
	</div>
);

const Media = ({ media }: { media: Media[]; }) => (
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
);

export default Media;