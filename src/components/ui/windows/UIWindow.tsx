interface UIWindowProps {
  children: React.ReactNode;
  title: string;
  onClose: () => void;
}

export const UIWindow: React.FC<UIWindowProps> = ({
  children,
  title,
  onClose,
}) => {
  return (
    <div className="window">
      <div className="window__header">
        <h2>{title}</h2>
        <button onClick={onClose}>X</button>
      </div>
      <div className="window__content">{children}</div>
    </div>
  );
};
