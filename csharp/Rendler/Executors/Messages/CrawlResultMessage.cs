using System.Runtime.Serialization;

namespace Rendler.Executors.Messages
{
    [DataContract]
    public class CrawlResultMessage
    {
        [DataMember]
        public string Url { get; set; }

        [DataMember]
        public string[] Links { get; set; }
    }
}
