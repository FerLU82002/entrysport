interface Props {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };

export const LoadingSpinner = ({ size = 'md', text }: Props) => (
  <div className="flex flex-col items-center justify-center gap-2">
    <div
      className={`${sizes[size]} animate-spin rounded-full border-4 border-gray-200 border-t-green-600`}
    />
    {text && <p className="text-sm text-gray-500">{text}</p>}
  </div>
);
