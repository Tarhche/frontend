import {useMemo} from "react";
import elementMap from "@/features/elements/element-map";

interface ElementProps {
  type: string;
  elements: {type: string; body: {[key: string]: any}}[];
  style?: any;
}

function Element(props: ElementProps) {
  const elementData = useMemo(
    () => props.elements.find((element) => element?.type === props.type),
    [props.type, props.elements],
  );

  if (!elementData) {
    return null;
  }

  const Component = elementData.type
    ? elementMap[elementData.type]
    : undefined;

  if (!Component) {
    return null;
  }

  return <Component style={props.style} data={elementData} />;
}

export default Element;
