export const availableTools = [
  {
    type: "function",
    function: {
      name: "execute_python",
      description: "Execute Python code in a secure sandboxed environment. Use this to perform calculations, data analysis, or run algorithms.",
      parameters: {
        type: "object",
        properties: {
          code: {
            type: "string",
            description: "The python code to execute. MUST be valid python."
          }
        },
        required: ["code"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_image",
      description: "Generate a new image based on a prompt.",
      parameters: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description: "A highly descriptive prompt for the image."
          },
          style: {
            type: "string",
            description: "Optional style ID (e.g. realistic, anime)."
          }
        },
        required: ["prompt"]
      }
    }
  }
];
