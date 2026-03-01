import { motion } from 'framer-motion';
const MotionNav = motion.nav;

const PageTransition = ({ children, className = "" }) => {
  return (
    <MotionNav
      className={className}
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {children}
    </MotionNav>
  );
};

export default PageTransition;