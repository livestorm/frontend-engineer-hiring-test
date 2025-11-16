export interface messageInterface {
    id: number,
    author_name: string,
    created_at: number,
    displayTime: string,
    text: string,
    reactions: { [key: string]: string[] }
}