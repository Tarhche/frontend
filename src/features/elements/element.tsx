import {useMemo} from "react";
import {Group} from "@mantine/core";
import elementMap from "@/features/elements/element-map";
import {EditContentButton} from "@/components/edit-content-button";
import {APP_PATHS} from "@/lib/app-paths";
import {PERMISSIONS} from "@/lib/app-permissions";

interface ElementProps {
  type: string;
  elements: {uuid?: string; type: string; body: {[key: string]: any}}[];
  style?: any;
  // Correlation uuid of the content the page is about, for elements that render
  // themselves relative to it (e.g. `stack`).
  currentUuid?: string;
}

function Element(props: ElementProps) {
  const elementData = useMemo(
    () => props.elements.find((element) => element?.type === props.type),
    [props.type, props.elements],
  );

  if (!elementData) {
    return null;
  }

  const Component = elementData.type ? elementMap[elementData.type] : undefined;

  if (!Component) {
    return null;
  }

  // Every element type gets its edit shortcut here rather than in each renderer.
  // It sits above the element rather than over it, since most elements lead with
  // a cover image that a transparent icon would disappear into. The row collapses
  // to nothing for logged out visitors, who get no button.
  return (
    <>
      {elementData.uuid && (
        <Group justify="flex-end" gap={0}>
          <EditContentButton
            href={APP_PATHS.dashboard.elements.edit(elementData.uuid)}
            permission={PERMISSIONS.elements.UPDATE}
          />
        </Group>
      )}
      <Component
        style={props.style}
        data={elementData}
        currentUuid={props.currentUuid}
      />
    </>
  );
}

export default Element;
