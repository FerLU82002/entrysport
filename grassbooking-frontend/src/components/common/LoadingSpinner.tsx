interface Props {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const sizes = { sm: 'h-4 w-4 border-2', md: 'h-7 w-7 border-2', lg: 'h-10 w-10 border-[3px]' };

export const LoadingSpinner = ({ size = 'md', text }: Props) => (
  <div className="flex flex-col items-center justify-center gap-2">
    <div
      className={`${sizes[size]} animate-spin rounded-full border-ink-200 border-t-ink-900`}
    />
    {text && <p className="text-sm text-ink-500">{text}</p>}
  </div>
);
