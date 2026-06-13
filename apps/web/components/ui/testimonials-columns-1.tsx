"use client";
import React from "react";
import { motion } from "framer-motion";

export interface Testimonial {
  text: string;
  image: string;
  name: string;
  role: string;
}

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: Testimonial[];
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{ translateY: "-50%" }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-5 pb-5"
      >
        {[...new Array(2).fill(0).map((_, index) => (
          <React.Fragment key={index}>
            {props.testimonials.map(({ text, image, name, role }, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl border border-[#F0E8D8] bg-white shadow-sm max-w-xs w-full hover:shadow-md transition-shadow"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-3">
                  {[1,2,3,4,5].map(n => (
                    <div key={n} className="w-3 h-3 rounded-sm bg-[#FFD200]" />
                  ))}
                </div>
                <p className="text-sm text-[#1A1A1A] leading-relaxed mb-5">{text}</p>
                <div className="flex items-center gap-3">
                  <img
                    width={36}
                    height={36}
                    src={image}
                    alt={name}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-[#1A1A1A] leading-tight">{name}</span>
                    <span className="text-xs text-[#6B6B6B] leading-tight">{role}</span>
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))]}
      </motion.div>
    </div>
  );
};
