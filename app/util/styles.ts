import { IDropdownStyles, IStackStyles, IStackTokens } from "@fluentui/react";
import { makeStyles, shorthands, tokens } from "@fluentui/react-components";

export const desktopMinWidth = '600px';

export const stackTokens: IStackTokens = { childrenGap: 20 };
export const stackStyles: Partial<IStackStyles> = {
  root: {
    position: 'absolute',
    left: '220px',
    bottom: 0,
    right: 0,
    height: '100%',
    maxHeight: '100%'
  }
}

export const commandBarItemStyles: Partial<IStackStyles> = { root: { width: 70, height: 35 } };

export const useInputStyles = makeStyles({
  root: {
    // Stack the label above the field
    display: 'flex',
    flexDirection: 'column',
    // Use 2px gap below the label (per the design system)
    ...shorthands.gap('2px'),
  }
});

export const useTextAreaStyes = makeStyles({
  base: {
    '& > div': {
      marginTop: tokens.spacingVerticalMNudge
    },
    '& > div > div': {
      display: 'flex',
      flexDirection: 'column',
      ...shorthands.borderRadius(tokens.borderRadiusMedium),
      ...shorthands.padding(tokens.spacingHorizontalMNudge)
    },
    '& > div > label': {
      marginBottom: tokens.spacingHorizontalXXS,
      marginLeft: tokens.spacingHorizontalMNudge
    }
  }
});