import Theme from '@codeday/topo/Theme';

export default ({ Component, pageProps }) => (
  <Theme $THEME_PROPS$brandColor="red">
    <Component {...pageProps} />
  </Theme>
);