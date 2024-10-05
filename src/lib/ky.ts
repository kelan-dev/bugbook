import originalKy from "ky";

// Ky is a wrapper around the fetch API that makes it easier to make HTTP requests
const ky = originalKy.create({
  parseJson: (text) =>
    JSON.parse(text, (key, value) => {
      // Convert date strings to Date objects
      if (key.endsWith("At")) return new Date(value);
      return value;
    }),
});

export default ky;
