import React, { useEffect, useState } from "react";
import { List, ListItem, Note } from "@contentful/forma-36-react-components";
import { SidebarExtensionSDK } from "contentful-ui-extensions-sdk";
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

  useEffect(() => {
    sdk.window.startAutoResizer();
    calculateMetrics(blogText);
  });

  contentField.onValueChanged((value) => {
    if (value !== blogText) {
      calculateMetrics(value);
    }
  });

  function calculateMetrics(value: string | undefined) {
    if (value === undefined) {
      setWordCount(0);
      setTimeToRead("0 min read");
      setBlogText(contentField.getValue());
      return;
    }
    const stats = readingTime(value);
    const { words, text } = stats;
    setTimeToRead(text);
    setWordCount(words);
    setBlogText(value);
  }

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
