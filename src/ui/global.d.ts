interface Window {
    app: import('./app').App;
}

declare module '*.svg' {
    const content: string;
    export default content;
} 