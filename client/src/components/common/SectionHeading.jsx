import React from 'react';

const SectionHeading = ({
  eyebrow,
  title,
  description,
  align = 'center',
  className = '',
}) => {
  const alignmentClass =
    align === 'left'
      ? 'text-left items-start'
      : align === 'right'
      ? 'text-right items-end'
      : 'text-center items-center mx-auto';

  return (
    <div className={`flex flex-col max-w-2xl mb-12 sm:mb-16 ${alignmentClass} ${className}`}>
      {eyebrow && (
        <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary-500 mb-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950/50 border border-primary-200/50 dark:border-primary-900/50">
          {eyebrow}
        </span>
      )}
      {title && (
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h2>
      )}
      {description && (
        <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
};

export default SectionHeading;
