import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type EmptyCategoryDropZoneProps = {
  categoryGroupId: string;
};

export const getEmptyCategoryDropZoneId = (categoryGroupId: string) =>
  `empty-${categoryGroupId}`;

export const EmptyCategoryDropZone = ({
  categoryGroupId,
}: EmptyCategoryDropZoneProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: getEmptyCategoryDropZoneId(categoryGroupId),
    data: {
      type: "emptygroup",
      categoryGroupId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="h-8 border-2 border-dashed border-neutral-content/20 rounded-sm mx-2 my-1 flex items-center justify-center text-neutral-content/40 text-xs"
    >
      Drop category here
    </div>
  );
};
