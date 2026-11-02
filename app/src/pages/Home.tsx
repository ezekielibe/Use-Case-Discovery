import { Link } from "react-router-dom";
import { Button, Text, Title1, Title3 } from "@fluentui/react-components";
import { LightbulbRegular, ThumbLikeRegular, TrophyRegular } from "@fluentui/react-icons";

const steps = [
  { icon: <LightbulbRegular fontSize={32} />, title: "1. Share", text: "Describe a repetitive task or process you'd like an AI agent to handle." },
  { icon: <ThumbLikeRegular fontSize={32} />, title: "2. Vote", text: "Browse ideas from other attendees and upvote the ones you'd love to see built." },
  { icon: <TrophyRegular fontSize={32} />, title: "3. Prioritise", text: "Facilitators score ideas on value, feasibility, data, effort and risk to pick the best candidates." },
];

export default function Home() {
  return (
    <div className="stack">
      <section className="panel stack">
        <Title1>Which parts of your work should become a Copilot Studio agent?</Title1>
        <Text size={400}>
          Welcome to the Use Case Discovery workshop. Share the scenarios where an agent could save you time, improve
          quality or delight your customers. No sign-in needed.
        </Text>
        <div className="row">
          <Link to="/submit">
            <Button appearance="primary" size="large">
              Share an idea
            </Button>
          </Link>
          <Link to="/ideas">
            <Button size="large">Browse & vote</Button>
          </Link>
          <Link to="/leaderboard">
            <Button size="large" appearance="subtle">
              See the leaderboard
            </Button>
          </Link>
        </div>
      </section>
      <section className="grid-2">
        {steps.map((s) => (
          <div key={s.title} className="panel stack">
            {s.icon}
            <Title3>{s.title}</Title3>
            <Text>{s.text}</Text>
          </div>
        ))}
      </section>
    </div>
  );
}
