import { Icons } from './icons';

type IconName = keyof typeof Icons;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Remove the logo injection code, keep only the icon handling
    document.querySelectorAll('[data-icon]').forEach(el => {
        const iconName = el.getAttribute('data-icon');
        if (iconName && isIconName(iconName)) {
            el.innerHTML = Icons[iconName];
        }
    });
});

// Type guard function to ensure we have a valid icon name
function isIconName(name: string): name is IconName {
    return name in Icons;
} 