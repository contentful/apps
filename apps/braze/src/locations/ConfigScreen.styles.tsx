import tokens from "@contentful/f36-tokens";
import { css } from "emotion";



export const styles = {
    body: css({
        height: 'auto',
        minHeight: '40vh',
        maxWidth: '900px',
        border: `1px solid ${tokens.gray300}`,
        borderRadius: tokens.borderRadiusMedium,
    }),
    splitter: css({
        marginTop: tokens.spacingL,
        marginBottom: tokens.spacingL,
        border: 0,
        height: '1px',
        backgroundColor: tokens.gray300,
    }),
    subheading: css({
        marging: 0
    }),
}
