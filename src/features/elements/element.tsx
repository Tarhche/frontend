import React, {useMemo} from "react";
import elementMap from "@/features/elements/element-map";

interface ElementProps {
  type: string;
  elements: {type: string; body: any}[]
  style?: any;
}

function Element(props: ElementProps) {
  const elementData = useMemo(() => {
    return props.elements.find((element) => element.type === props.type)
  }, [props.type, props.elements]);

  const Component = elementMap[props.type];

  if (!Component)
    return <></>
  return <Component style={props.style} data={elementData} />;
}

export default Element;
