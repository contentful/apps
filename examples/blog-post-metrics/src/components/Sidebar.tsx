import React, { useCallback, useEffect, useState } from "react";
import { List, ListItem, Note } from "@contentful/forma-36-react-components";
import { SidebarExtensionSDK } from "@contentful/app-sdk";
import readingTime from "reading-time";
interface SidebarProps {
  sdk: SidebarExtensionSDK;
}
const CONTENT_FIELD_ID = "body";
const Sidebar = (props: SidebarProps) => {
  const { sdk } = props;

  const contentField = sdk.entry.fields[CONTENT_FIELD_ID];

  const [wordCount, setWordCount] = useState(0);
  const [timeToRead, setTimeToRead] = useState("0 min read");
  const [blogText, setBlogText] = useState(contentField?.getValue());

  const calculateMetrics = useCallback((value) => {
    const stats = readingTime(value || "");
    const { words, text } = stats;
    setTimeToRead(text);
    setWordCount(words);
    setBlogText(value);
  }, []);

  useEffect(() => {
    sdk.window.startAutoResizer();
    calculateMetrics(blogText);
  }, []);

  useEffect(() => {
    const detach = contentField.onValueChanged((value) => {
      calculateMetrics(value);
    });
    return () => detach();
  }, [contentField, calculateMetrics]);

  return (
    <>
      <Note style={{ marginBottom: "12px" }}>
        Metrics for your blog post:
        <List style={{ marginTop: "12px" }}>
          <ListItem>Word count: {wordCount}</ListItem>
          <ListItem>Reading time: {timeToRead}</ListItem>
        </List>
      </Note>
    </>
  );
};
export default Sidebar;
