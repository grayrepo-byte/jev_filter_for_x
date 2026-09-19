export const TWEET_WITH_ID = `
<article data-testid="tweet">
  <div data-testid="User-Name"><span>John Doe</span><span>@john</span></div>
  <div data-testid="tweetText">Found a SaaS doing $40k MRR.</div>
  <a href="/john/status/2030234234234"><time datetime="2026-01-01"></time></a>
</article>
`

export const TWEET_WITHOUT_ID = `
<article data-testid="tweet">
  <div data-testid="User-Name"><span>Mike</span><span>@mike</span></div>
  <div data-testid="tweetText">今天真的烦死了。</div>
</article>
`

export const NOT_A_TWEET = `
<article data-testid="cellInnerDiv"><div>sidebar</div></article>
`
