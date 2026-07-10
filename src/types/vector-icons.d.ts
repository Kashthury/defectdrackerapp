// Ambient module declarations for react-native-vector-icons.
// The package ships without bundled TypeScript types, so we declare the icon
// set entry points we use as typed React components. This keeps `noImplicitAny`
// happy across the app without pulling in an extra @types dependency.
declare module 'react-native-vector-icons/Feather' {
  import { Component } from 'react';
  import { TextProps } from 'react-native';

  export interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
  }

  export default class Icon extends Component<IconProps> {}
}

declare module 'react-native-vector-icons/*' {
  import { Component } from 'react';
  import { TextProps } from 'react-native';

  export interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
  }

  export default class Icon extends Component<IconProps> {}
}
