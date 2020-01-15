// this comment tells babel to convert jsx to calls to a function called jsx instead of React.createElement
import React, {useState, useEffect} from 'react'
import axios from 'axios'
import moment from 'moment'

let axiosInstance = axios.create({
  baseURL: `/api/v4`,
})

const ProjectsList = () => {
  const [projects, setProjects] = useState(["easybell"])

  useEffect(() => {
    async function getProjects() {
      const {data:projectsList} = await axiosInstance.get(`/projects?order_by=last_activity_at&simple=true&min_access_level=10&per_page=1000`)
      const projectIds = projectsList.map(project => project.id)
      const projectsData = await Promise.all(projectIds.map(id => axiosInstance.get(`/projects/${id}`)))
      setProjects(projectsData.map(project => project.data))
    }
    getProjects()
  }, [])  

  return projects.length > 0 ? (
    <div className="w-full h-full min-h-screen">
      <nav className="w-full h-16 bg-purple-900">
        <div className="container mx-auto h-full flex justify-start items-center">
          <h3 className="text-lg text-white font">Giltab Deployment Dashboard</h3>
        </div>
      </nav>
      <div className="container mx-auto">
        <ul>
          {projects.map(project => <Project project={project} key={project.id} />)}
        </ul>
      </div>
    </div>
  ) : ""
} 


const Project = ({project}) => {
  const [environments, setEnvironments] = useState([])
  const environmentsOrder = ["production", "staging", "feature", "feature-marketing"]
  const sortAndFilterEnvironments = (environments) => {
    const environmentsCopy = [...environments].filter(environment => environmentsOrder.includes(environment.name))
    environmentsCopy.sort((a,b) => {
      if (environmentsOrder.indexOf(a.name) === -1) {
        return -1
      }
      if (environmentsOrder.indexOf(a.name) > environmentsOrder.indexOf(b.name)) {
        return 1;
      }
      if (environmentsOrder.indexOf(a.name) < environmentsOrder.indexOf(b.name)) {
        return -1;
      }
      return 0;
    })

    return environmentsCopy
  }

  useEffect(() => {
    async function requestEnvironments() {
      const url = `/projects/${project.id}/environments`
      const {data:projectEnvironments} = await axiosInstance.get(url)
      console.log(projectEnvironments)
      setEnvironments(projectEnvironments || [])
    }
    requestEnvironments().catch(() => console.log("error for project id: ", project.id))
  }, [project.id])  
  
  return environments.length > 0 ? (<li className="flex flex-col my-4 shadow hover:shadow-lg rounded-sm bg-gray-100 border-l-4 border-transparent hover:border-purple-900" style={{transition: "0.2s"}}>
    <a className="flex items-center p-4 cursor-pointer" href={project.web_url} target="_blank">
      {project.avatar_url ? <img src={project.avatar_url} alt="" className="w-12 mr-4" /> : <div className="bg-gray-300 w-12 h-12 mr-4 rounded" />}
      <h2 className="text-2xl font-semibold">{project.name_with_namespace} <span className="font-normal text-base">(id: {project.id})</span></h2>
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
          {sortAndFilterEnvironments(environments).map(environment => <Environment environment={environment} project={project} key={environment.id} />)}
        </tbody>
      </table>
    </div>
  </li>) : ""
}


const Environment = ({environment, project}) => {
  
  return environment.state === "available" ? (
    <tr className="border-b-2 border-gray-300">
      <td className="">
        <a className="font-bold w-36 cursor-pointer" target="_blank" href={environment.external_url}>
          {environment.name.charAt(0).toUpperCase() + environment.name.slice(1)}
        </a>
      </td>
      <EnvironmentData environment={environment} project={project} />
    </tr>) : ""
}

const EnvironmentData = ({environment, project}) => {
  const [environmentData, setEnvironmentData] = useState([])
  
  useEffect(() => {
    async function requestEnvironmentData() {
      const url = `/projects/${project.id}/environments/${environment.id}`
      const {data:environmentData} = await axiosInstance.get(url)
      console.log(environmentData)
      setEnvironmentData(environmentData || {})
    }
    requestEnvironmentData()
  }, [environment.id, environment.project.id, project.id])  

  return environmentData.last_deployment ? (<>
    <td><a href={`${project.web_url}/tree/${environmentData.last_deployment.ref}`} target="_blank"><code className="bg-gray-300 py-1 px-2 rounded">{environmentData.last_deployment.ref}</code></a></td>
    <td>
      <a href={environmentData.last_deployment.deployable.pipeline.web_url} target="_blank" className="cursor-pointer">
        <p>{moment(environmentData.last_deployment.deployable.finished_at).fromNow()}</p>
        <p className="text-sm text-gray-700">{moment(environmentData.last_deployment.deployable.finished_at).format('DD.MM.YYYY HH:mm')}h</p>
      </a>
    </td>
    <td className="py-2">
      <a href={`${project.web_url}/commits/${environmentData.last_deployment.deployable.commit.id}`} target="_blank" className="cursor-pointer">
      <code className="bg-gray-300 py-1 px-2 rounded">{environmentData.last_deployment.deployable.commit.short_id}</code>
      <div className="flex content-center mt-4">
        <img className="w-6 h-6 mr-2 rounded-full" src={environmentData.last_deployment.deployable.user.avatar_url} alt=""/>
        <p>{environmentData.last_deployment.deployable.user.name}</p>
      </div>
      </a>
    </td>
    <td>
      <a href={environmentData.last_deployment.deployable.user.web_url} target="_blank" className="flex content-center cursor-pointer">
        <img className="w-8 h-8 mr-2 rounded-full" src={environmentData.last_deployment.deployable.user.avatar_url} alt=""/>
        <p>{environmentData.last_deployment.deployable.user.name}</p>
      </a>
    </td>
    </>
  ) : ""
}

const App = () => {
  return(
    <ProjectsList />
  )
}

export default App;
