import {
  ColorPicker,
  getColorFromString,
  IColor,
  IColorPickerStyles,
  mergeStyleSets
} from '@fluentui/react';
import React from 'react';

const white = getColorFromString('#ffffff')!;

interface InputProps {
    onChange: (color: IColor)=>void, 
    color?: IColor,
}
export const PickColor = (p: InputProps) => {
  const [color, setColor] = React.useState(p.color == undefined ? white: p.color);
  const updateColor = React.useCallback((ev: any, colorObj: IColor) => setColor(colorObj), []);

  return (
    <div className={classNames.wrapper}>
      <ColorPicker
        color={color}
        onChange={(e:any, color: IColor)=>{
            p.onChange(color);
            updateColor(e, color);
        }}
        alphaType={"alpha"}
        showPreview={true}
        styles={colorPickerStyles}
        // The ColorPicker provides default English strings for visible text.
        // If your app is localized, you MUST provide the `strings` prop with localized strings.
        strings={{
          // By default, the sliders will use the text field labels as their aria labels.
          // Previously this example had more detailed instructions in the labels, but this is
          // a bad practice and not recommended. Labels should be concise, and match visible text when possible.
          hueAriaLabel: 'Hue',
        }}
      />
    </div>
  );
};


const classNames = mergeStyleSets({
  wrapper: { display: 'flex' },
});

const colorPickerStyles: Partial<IColorPickerStyles> = {
  panel: { padding: 0 },
  root: {
    //maxWidth: '50vh',
    //minWidth: '20vh',
  },
  colorRectangle: { height: 268 },
};
