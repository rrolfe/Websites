# Rob Rolfe portfolio

A plain static site: every page is an HTML file, there is no build step. Edit a file, commit, and GitHub Pages publishes it.

## Layout

- `index.html` is the home page (work grid, About, contact).
- `contact/` is the contact page.
- `robrolfeportfolio/<project>/` holds one page per project. These are the same paths the Squarespace site used, so old links keep working. `crosby-nursery-pyr64/` and `robrolfeportfolio/` are small redirect pages.
- `assets/img/` holds the images. Large ones come as a pair: the full-size file and a `-800w` copy that phones load. Keep both when swapping an image.
- `assets/og/` holds the 1200x630 share images used when a link is pasted into LinkedIn, iMessage, Slack and so on.
- `assets/site.css` and `assets/site.js` hold the styles and the filter, search and image viewer. The pages work without the script.
- `sitemap.xml`, `robots.txt` and `404.html` are for search engines and missing pages.

## Before pointing robrolfeportfolio.com here

Canonical links, share images and the sitemap already use `https://www.robrolfeportfolio.com/`, so they only become correct once the domain serves this site. The steps, in order:

1. Move this folder into its own repository so it is served from the root of the domain.
2. Add a `CNAME` file containing `www.robrolfeportfolio.com` and set the custom domain in the repository's Pages settings.
3. Update the domain's DNS records to point at GitHub Pages, then turn on "Enforce HTTPS".
4. Check the live site, then cancel the Squarespace site plan. Keep the domain registration itself.
