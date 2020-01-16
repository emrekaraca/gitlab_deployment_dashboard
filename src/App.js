// this comment tells babel to convert jsx to calls to a function called jsx instead of React.createElement
import React, { useState, useEffect } from "react";
import axios from "axios";
import moment from "moment";

let axiosInstance = axios.create({
  baseURL: `/api/v4`
});

const ProjectsList = () => {
  const [projects, setProjects] = useState([]);
  const [loadingStatus, setLoadingStatus] = useState(["projects"]);

  useEffect(() => {
    async function getProjectsData() {
      setLoadingStatus("projects");

      const projectsUrl = `/projects?order_by=last_activity_at&simple=true&min_access_level=10&per_page=1000`;
      const { data: projectsList } = await axiosInstance.get(projectsUrl);
      const projectIds = projectsList.map(project => project.id);

      const projectsData = await Promise.all(
        projectIds.map(id => axiosInstance.get(`/projects/${id}`))
      );

      setLoadingStatus("environments");

      const allEnvironments = await Promise.all(
        projectsData
          .map(projectData => projectData.data)
          .map(project => {
            const environmentsUrl = `/projects/${project.id}/environments`;
            return axiosInstance.get(environmentsUrl).catch(() => []);
          })
      );

      setLoadingStatus("deployments");

      const allAvailableEnvironments = allEnvironments
        .filter(
          environmentData =>
            environmentData.status && environmentData.status === 200
        )
        .map(environmentData => environmentData.data)
        .flat()
        .filter(environment => environment.state === "available");

      const allEnvironmentDetails = await Promise.all(
        allAvailableEnvironments.map(environment => {
          const environmentUrl = `/projects/${environment.project.id}/environments/${environment.id}`;
          return axiosInstance.get(environmentUrl);
        })
      );

      const allEnvironmentsWithDetails = allAvailableEnvironments.map(
        environment => {
          let environmentObject = {
            id: environment.id,
            name: environment.name,
            externalUrl: environment.external_url,
            projectId: environment.project.id
          };

          const environmentDeployment = allEnvironmentDetails
            .map(environmentDetailsResponse => environmentDetailsResponse.data)
            .find(
              environmentDetails => environmentDetails.id === environment.id
            );

          if (environmentDeployment) {
            environmentObject.deployment =
              environmentDeployment.last_deployment;
          }

          return environmentObject;
        }
      );

      const projectsWithEnvironment = projectsData
        .map(projectData => projectData.data)
        .filter(project =>
          allAvailableEnvironments.some(
            environment => environment.project.id === project.id
          )
        )
        .map(project => {
          const {
            id,
            name,
            name_with_namespace,
            web_url,
            avatar_url
          } = project;
          const projectData = {
            id,
            name,
            name_with_namespace,
            web_url,
            avatar_url,
            environments: allEnvironmentsWithDetails.filter(
              environment => environment.projectId === project.id
            )
          };

          setLoadingStatus("done");

          return projectData;
        });
      console.log(projectsWithEnvironment);
      setProjects(projectsWithEnvironment);
    }
    getProjectsData();
  }, []);

  return (
    <div className="w-full h-full min-h-screen">
      <nav className="w-full h-16 bg-purple-900">
        <div className="container mx-auto h-full flex justify-start items-center">
          <h3 className="text-lg text-white font">
            Giltab Deployment Dashboard
          </h3>
        </div>
      </nav>
      <div className="container mx-auto">
        <div className="flex justify-center mt-8">
          {loadingStatus === "projects" ? <p>Loading Projects...</p> : ""}
          {loadingStatus === "environments" ? (
            <p>Loading Environments...</p>
          ) : (
            ""
          )}
          {loadingStatus === "deployments" ? <p>Loading Deployments...</p> : ""}
        </div>
        {projects.length > 0 ? (
          <ul>
            {projects.map(project => (
              <Project project={project} key={project.id} />
            ))}
          </ul>
        ) : (
          ""
        )}
      </div>
    </div>
  );
};

const Project = ({ project }) => {
  const environmentsOrder = [
    "production",
    "staging",
    "feature",
    "feature-marketing"
  ];
  const sortAndFilterEnvironments = environments => {
    const environmentsCopy = [...environments].filter(environment =>
      environmentsOrder.includes(environment.name)
    );
    environmentsCopy.sort((a, b) => {
      if (environmentsOrder.indexOf(a.name) === -1) {
        return -1;
      }
      if (
        environmentsOrder.indexOf(a.name) > environmentsOrder.indexOf(b.name)
      ) {
        return 1;
      }
      if (
        environmentsOrder.indexOf(a.name) < environmentsOrder.indexOf(b.name)
      ) {
        return -1;
      }
      return 0;
    });

    return environmentsCopy;
  };

  return (
    <li
      className="flex flex-col my-4 shadow hover:shadow-lg rounded-sm bg-gray-100 border-l-4 border-transparent hover:border-purple-900"
      style={{ transition: "0.2s" }}
    >
      <a
        className="flex items-center p-4 cursor-pointer"
        href={project.web_url}
        target="_blank"
      >
        {project.avatar_url ? (
          <img src={project.avatar_url} alt="" className="w-12 mr-4" />
        ) : (
          <div className="bg-gray-300 w-12 h-12 mr-4 rounded" />
        )}
        <h2 className="text-2xl font-semibold">
          {project.name_with_namespace}{" "}
          <span className="font-normal text-base">(id: {project.id})</span>
        </h2>
      </a>
      <div className="p-2">
        <table className="w-full p-2">
          <thead>
            <tr className="border-b-2 border-gray-400">
              <th className="py-2 ">Environment</th>
              <th className="py-2 ">Branch-name</th>
              <th className="py-2 ">Latest Deploy</th>
              <th className="py-2 ">Latest Commit</th>
              <th className="py-2 ">Triggered By</th>
            </tr>
          </thead>
          <tbody>
            {sortAndFilterEnvironments(project.environments).map(
              environment => (
                <Environment
                  environment={environment}
                  project={project}
                  key={environment.id}
                />
              )
            )}
          </tbody>
        </table>
      </div>
    </li>
  );
};

const Environment = ({ environment, project }) => {
  return (
    <tr className="border-b-2 border-gray-300">
      <td className="">
        <a
          className="font-bold w-36 cursor-pointer"
          target="_blank"
          href={environment.externalUrl}
        >
          {environment.name.charAt(0).toUpperCase() + environment.name.slice(1)}
        </a>
      </td>
      <EnvironmentData environment={environment} project={project} />
    </tr>
  );
};

const EnvironmentData = ({ environment, project }) => {
  return (
    <>
      <td>
        <a
          href={`${project.web_url}/tree/${environment.deployment.ref}`}
          target="_blank"
        >
          <code className="bg-gray-300 py-1 px-2 rounded">
            {environment.deployment.ref}
          </code>
        </a>
      </td>
      <td>
        <a
          href={environment.deployment.deployable.pipeline.web_url}
          target="_blank"
          className="cursor-pointer"
        >
          <p>
            {moment(environment.deployment.deployable.finished_at).fromNow()}
          </p>
          <p className="text-sm text-gray-700">
            {moment(environment.deployment.deployable.finished_at).format(
              "DD.MM.YYYY HH:mm"
            )}
            h
          </p>
        </a>
      </td>
      <td className="py-2">
        <a
          href={`${project.web_url}/commit/${environment.deployment.deployable.commit.id}`}
          target="_blank"
          className="cursor-pointer"
        >
          <code className="bg-gray-300 py-1 px-2 rounded">
            {environment.deployment.deployable.commit.short_id}
          </code>
          <p className="text-sm text-gray-700 mt-4">
            Author: {environment.deployment.deployable.commit.author_name}
          </p>
        </a>
      </td>
      <td>
        <a
          href={environment.deployment.deployable.user.web_url}
          target="_blank"
          className="flex content-center cursor-pointer"
        >
          <img
            className="w-8 h-8 mr-2 rounded-full"
            src={environment.deployment.deployable.user.avatar_url}
            alt=""
          />
          <p>{environment.deployment.deployable.user.name}</p>
        </a>
      </td>
    </>
  );
};

const App = () => {
  return <ProjectsList />;
};

export default App;
