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
      console.log(projectsList)
      const projectIds = projectsList.map(project => project.id)
      console.log(projectIds)
      const projectsData = await Promise.all(projectIds.map(id => axiosInstance.get(`/projects/${id}`)))
      console.log(projectsData.map(project => project.data))
      setProjects(projectsData.map(project => project.data))
    }
    getProjects()
  }, [])  

  return projects.length > 0 ? (
    <div className="w-full h-full min-h-screen bg-orange-400 p-4">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold">Projects</h1>
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
  
  return environments.length > 0 ? (<li className="flex flex-col my-4 shadow rounded-sm bg-gray-100">
    <div className="flex items-center p-4">
      {project.avatar_url ? <img src={project.avatar_url} alt="" className="w-12 mr-4" /> : <div className="bg-gray-300 w-12 h-12 mr-4 rounded" />}
      <h2 className="text-2xl font-semibold">{project.name_with_namespace} <span className="font-normal text-base">(id: {project.id})</span></h2>
    </div>
    <div className="flex flex-col bg-gray-300 p-4">
        {sortAndFilterEnvironments(environments).map(environment => <Environment environment={environment} project={project} key={environment.id} />)}
    </div>
  </li>) : ""
}


const Environment = ({environment, project}) => {
  
  return (
    <div className="flex h-16 my-2">
      <div className="flex items-center h-full bg-gray-500 p-2">
        <h3 className="text-xl w-48">
          {environment.name.toUpperCase()}
        </h3>
      </div>
      <EnvironmentData environment={environment} project={project} />
    </div>)
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

  return (<div className="flex h-full">
    <div className="flex h-full items-center bg-green-500 p-2 mr-2" ><p>{environmentData.last_deployment ? environmentData.last_deployment.ref : ""}</p></div>
    <div className="flex flex-col h-full bg-green-500 p-2" ><p >{environmentData.last_deployment ? moment(environmentData.last_deployment.created_at).format('LLLL') : ""}</p><p >{environmentData.last_deployment ? moment(environmentData.last_deployment.created_at).fromNow() : ""}</p></div>
  </div>
  )
}

const App = () => {
  return(
    <ProjectsList />
  )
}

export default App;
