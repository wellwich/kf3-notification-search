import { jsxRenderer } from "hono/jsx-renderer";
import { Script } from "honox/server";
import { Link } from "honox/server";

export default jsxRenderer(({ children, title }) => {
	const pageTitle = "けもフレ３おしらせ検索";
	const description = "けもフレ３のおしらせを検索できるサイトです。";
	const ogImagePath = "https://data.wellwich.com/kf3/og-image.jpg";
	return (
		<html lang="ja">
			<head>
				<meta charset="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				{/* OGP */}
				<meta property="og:site_name" content={title} />
				<meta property="og:title" content={pageTitle} />
				<meta property="og:description" content={description} />
				<meta property="og:image" content={ogImagePath} />
				<meta property="og:locale" content="ja_JP" />
				{/* Twitter */}
				<meta name="twitter:card" content="summary_large_image" />
				<meta name="twitter:title" content={pageTitle} />
				<meta name="twitter:description" content={description} />
				<meta name="twitter:image" content={ogImagePath} />

				<title>{title}</title>
				<link rel="icon" href="/favicon.ico" />
				<Script src="/app/client.ts" async />
				<Link href="/app/style.css" rel="stylesheet" />
			</head>
			<body>
				<main class="bg-yellow-400">
					<div class="max-w-5xl mx-auto ">
						<body class=" font-noto-sans">{children}</body>
					</div>
				</main>
			</body>
		</html>
	);
});
